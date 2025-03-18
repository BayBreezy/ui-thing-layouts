<template>
  <UiDropdownMenu>
    <UiDropdownMenuTrigger as-child>
      <UiButton variant="ghost" class="h-auto p-0 hover:bg-transparent">
        <UiAvatar class="size-8">
          <UiAvatarImage src="/user-image.png" width="32" height="32" alt="Profile image" />
          <UiAvatarFallback>KK</UiAvatarFallback>
        </UiAvatar>
      </UiButton>
    </UiDropdownMenuTrigger>
    <UiDropdownMenuContent class="max-w-64" align="end">
      <UiDropdownMenuLabel class="flex min-w-0 flex-col">
        <span class="truncate text-sm font-medium text-foreground"> Keith Kennedy </span>
        <span class="truncate text-xs font-normal text-muted-foreground">
          k.kennedy@originui.com
        </span>
      </UiDropdownMenuLabel>
      <UiDropdownMenuSeparator />
      <UiDropdownMenuGroup>
        <UiDropdownMenuItem>
          <Icon name="ri:settings-line" class="size-4 opacity-60" aria-hidden="true" />
          <span>Account settings</span>
        </UiDropdownMenuItem>
        <UiDropdownMenuItem>
          <Icon name="ri:team-line" class="size-4 opacity-60" aria-hidden="true" />
          <span>Affiliate area</span>
        </UiDropdownMenuItem>
      </UiDropdownMenuGroup>
      <UiDropdownMenuSeparator />
      <UiDropdownMenuItem>
        <Icon name="ri:logout-box-line" class="size-4 opacity-60" aria-hidden="true" />
        <span>Sign out</span>
      </UiDropdownMenuItem>
    </UiDropdownMenuContent>
  </UiDropdownMenu>
</template>

<script lang="ts" setup></script>
